import logging
from databricks.sdk import WorkspaceClient

logger = logging.getLogger(__name__)

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

        status_val = msg.status.value if hasattr(msg.status, "value") else str(msg.status)
        
        status_message = ""
        summary = None
        data = None
        trusted_asset = False
        error = None

        if status_val == "STARTING":
            status_message = "Genie is thinking"
        elif status_val == "EXECUTING_QUERY":
            status_message = "Calculating results on SQL Warehouse..."
        elif status_val == "COMPLETED":
            status_message = "Query complete"
        elif status_val in ["FAILED", "CANCELLED"]:
            status_message = "Query failed"
            # Optional: parse error details from msg
        else:
            status_message = "Processing..."
            
        # Extract Results if completed
        if status_val == "COMPLETED":
            # Extract natural language summary
            if getattr(msg, "attachments", None):
                for att in msg.attachments:
                    if hasattr(att, "text") and att.text:
                        summary = att.text.content if hasattr(att.text, "content") else att.text
                    
                    # Fetching tabular results for query attachments
                    if hasattr(att, "query") and att.query:
                        try:
                            # Depending on the SDK, passing attachment_id is needed
                            att_id = att.id
                            result = self.client.genie.get_message_attachment_query_result(
                                space_id=space_id,
                                conversation_id=conversation_id,
                                message_id=message_id,
                                attachment_id=att_id
                            )
                            # Depending on the object returned, we either serialize to dict or return URL.
                            # Standard pattern: return statement object or results.
                            if hasattr(result, "as_dict"):
                                data = result.as_dict()
                            else:
                                data = result
                        except Exception as e:
                            logger.error(f"Failed to fetch query result: {e}")
                            
            # Check for trusted asset flag
            if getattr(msg, "metadata", None) and hasattr(msg.metadata, "trusted"):
                trusted_asset = msg.metadata.trusted

        return {
            "status": status_val,
            "status_message": status_message,
            "summary": summary,
            "data": data,
            "trusted_asset": trusted_asset,
            "error": error
        }

    def submit_feedback(self, space_id: str, conversation_id: str, message_id: str, rating: str):
        """
        Sends POSITIVE or NEGATIVE feedback to the model.
        """
        # In current databricks SDK, it might be create_message_feedback
        # We will wrap in try/except to give graceful error if not supported in the exact SDK version
        try:
            # We assume rating is handled via the SDK enum or string pass-through
            self.client.genie.create_message_feedback(
                space_id=space_id,
                conversation_id=conversation_id,
                message_id=message_id,
                rating=rating
            )
            return True
        except Exception as e:
            logger.error(f"Error submitting feedback: {e}")
            raise e
