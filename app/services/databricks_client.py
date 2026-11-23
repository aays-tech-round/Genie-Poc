import logging
from concurrent.futures import ThreadPoolExecutor
from databricks.sdk import WorkspaceClient
from databricks.sdk.errors import NotFound
from databricks.sdk.service.dashboards import GenieFeedbackRating

logger = logging.getLogger(__name__)

# Opening a chat fetches one result table per answer; a few at a time keeps it quick without flooding Databricks.
_MESSAGE_FETCH_WORKERS = 4
_MESSAGE_PAGE_SIZE = 100
_MESSAGE_MAX_PAGES = 20

class DatabricksGenieClient:
    def __init__(self):
        # By default, WorkspaceClient picks up environment variables:
        # DATABRICKS_HOST, DATABRICKS_CLIENT_ID, DATABRICKS_CLIENT_SECRET
        self.client = WorkspaceClient()

    def ask(self, space_id: str, content: str, conversation_id: str = None):
        """
        Starts a conversation or creates a new message.
        """
        logger.info(f"Asking Genie in space {space_id}...")
        body = {"content": content}
        
        if conversation_id:
            try:
                res = self.client.api_client.do(
                    "POST",
                    f"/api/2.0/genie/spaces/{space_id}/conversations/{conversation_id}/messages",
                    body=body
                )
            except Exception as raw_e:
                # Catch Databricks API direct HTTP errors rather than parsing faults
                raise Exception(f"Genie Backend HTTP Error: {raw_e}")

            # Safely extract from raw JSON dictionary response without rigid dataclass definitions
            msg_id = res.get("id") or res.get("message_id")
            if not msg_id:
                # If nested inside a distinct wrapper layer
                msg_id = (res.get("message") or {}).get("id") or "fallback_msg_" + str(len(res))
            
            return {"message_id": msg_id, "conversation_id": conversation_id}
        else:
            try:
                res = self.client.api_client.do(
                    "POST",
                    f"/api/2.0/genie/spaces/{space_id}/start-conversation",
                    body=body
                )
            except Exception as raw_e:
                raise Exception(f"Genie Backend HTTP Error: {raw_e}")

            conv_id = res.get("conversation_id") or res.get("id")
            msg_id = res.get("message_id") or (res.get("message") or {}).get("id") or "fallback_msg_" + str(len(res))
                
            return {"message_id": msg_id, "conversation_id": conv_id}

    def get_status(self, space_id: str, conversation_id: str, message_id: str):
        """
        Retrieves the message status and extracts pertinent details.
        """
        msg = self.client.genie.get_message(
            space_id=space_id,
            conversation_id=conversation_id,
            message_id=message_id
        )
        return self._status_from_message(msg, space_id, conversation_id, message_id)

    def list_messages(self, space_id: str, conversation_id: str):
        """
        Every message of a conversation, oldest first, each in the same shape as get_status
        plus the question that was asked ("content") and its "message_id".
        """
        messages = []
        page_token = None
        for _ in range(_MESSAGE_MAX_PAGES):
            page = self.client.genie.list_conversation_messages(
                space_id=space_id,
                conversation_id=conversation_id,
                page_size=_MESSAGE_PAGE_SIZE,
                page_token=page_token,
            )
            messages.extend(page.messages or [])
            page_token = page.next_page_token
            if not page_token:
                break
        messages.sort(key=lambda m: m.created_timestamp or 0)

        def build(msg):
            message_id = msg.message_id or msg.id
            status = msg.status.value if hasattr(msg.status, "value") else str(msg.status)
            # The listing may leave out attachments (answer text, SQL); read the full message then.
            if status == "COMPLETED" and not msg.attachments:
                try:
                    msg = self.client.genie.get_message(
                        space_id=space_id, conversation_id=conversation_id, message_id=message_id
                    )
                except Exception as e:
                    logger.error(f"Failed to read message {message_id}: {e}")
            return {
                "message_id": message_id,
                "content": msg.content or "",
                **self._status_from_message(msg, space_id, conversation_id, message_id),
            }

        with ThreadPoolExecutor(max_workers=_MESSAGE_FETCH_WORKERS) as pool:
            return list(pool.map(build, messages))

    def _status_from_message(self, msg, space_id: str, conversation_id: str, message_id: str):
        """
        Turns a Genie message into the status, answer text, table and SQL details the UI shows.
        """
        status_val = msg.status.value if hasattr(msg.status, "value") else str(msg.status)
        
        summary = None
        data = None
        trusted_asset = False
        error = None

        # Genie reports progress only as a status code (e.g. FETCHING_METADATA); it sends
        # no progress text, so the code is passed through unchanged for the UI to show.
        if getattr(msg, "error", None):
            error = msg.error.error or (msg.error.type.value if msg.error.type else None)

        # Genie's reasoning, SQL and follow-ups arrive as attachments while it works,
        # so read them on every poll rather than only once the message completes.
        insights = self._insights_from_attachments(getattr(msg, "attachments", None) or [])

        # Extract Results if completed
        if status_val == "COMPLETED":
            if getattr(msg, "attachments", None):
                for att in msg.attachments:
                    if att.text and att.text.content:
                        summary = att.text.content
                    
                    # Fetching tabular results for query attachments
                    if att.query:
                        try:
                            result = self.client.genie.get_message_attachment_query_result(
                                space_id=space_id,
                                conversation_id=conversation_id,
                                message_id=message_id,
                                attachment_id=att.attachment_id
                            )
                            data = self._rows_from_result(result)
                        except Exception as e:
                            logger.error(f"Failed to fetch query result: {e}")
                            
            # Check for trusted asset flag
            if getattr(msg, "metadata", None) and hasattr(msg.metadata, "trusted"):
                trusted_asset = msg.metadata.trusted

        return {
            "status": status_val,
            "summary": summary,
            "data": data,
            "trusted_asset": trusted_asset,
            "error": error,
            **insights,
        }

    @staticmethod
    def _insights_from_attachments(attachments):
        """
        Collects the generated SQL (with its parameters), Genie's thoughts about it and
        any suggested follow-up questions from a message's attachments.
        """
        insights = {
            "sql": None,
            "sql_parameters": None,
            "query_title": None,
            "query_description": None,
            "thoughts": None,
            "suggested_questions": None,
        }
        for att in attachments:
            query = getattr(att, "query", None)
            if query:
                insights["sql"] = query.query or None
                insights["query_title"] = query.title or None
                insights["query_description"] = query.description or None
                if query.parameters:
                    insights["sql_parameters"] = [
                        {"keyword": p.keyword, "sql_type": p.sql_type, "value": p.value}
                        for p in query.parameters
                    ]
                if query.thoughts:
                    # THOUGHT_TYPE_DATA_SOURCING -> "data_sourcing"
                    insights["thoughts"] = [
                        {
                            "type": (t.thought_type.value if t.thought_type else "")
                            .replace("THOUGHT_TYPE_", "").lower(),
                            "content": t.content or "",
                        }
                        for t in query.thoughts
                        if t.content
                    ]

            suggested = getattr(att, "suggested_questions", None)
            if suggested and suggested.questions:
                insights["suggested_questions"] = list(suggested.questions)
        return insights

    @staticmethod
    def _rows_from_result(result):
        """
        Converts a query result into a list of {column: value} dicts.
        """
        statement = getattr(result, "statement_response", None)
        if not statement or not statement.manifest or not statement.manifest.schema:
            return []
        columns = [c.name for c in (statement.manifest.schema.columns or [])]
        rows = (statement.result.data_array if statement.result else None) or []
        return [dict(zip(columns, row)) for row in rows]

    def delete_conversation(self, space_id: str, conversation_id: str) -> bool:
        """
        Deletes a conversation and all its messages in Genie. Returns False when Genie no longer
        has it (already deleted), so a retried delete still completes.
        """
        try:
            self.client.genie.delete_conversation(space_id=space_id, conversation_id=conversation_id)
            return True
        except NotFound:
            return False

    def submit_feedback(self, space_id: str, conversation_id: str, message_id: str, rating: str):
        """
        Sends POSITIVE or NEGATIVE feedback to the model.
        """
        try:
            self.client.genie.send_message_feedback(
                space_id=space_id,
                conversation_id=conversation_id,
                message_id=message_id,
                rating=GenieFeedbackRating(rating.upper())
            )
            return True
        except Exception as e:
            logger.error(f"Error submitting feedback: {e}")
            raise e
