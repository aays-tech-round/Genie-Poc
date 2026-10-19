"Build a production-grade Python backend (FastAPI preferred) to integrate Databricks Genie into a custom UI using the databricks-sdk. The implementation must include:Authentication: Use a WorkspaceClient initialized via Service Principal (OAuth) credentials.Asynchronous Conversation Flow: >    - Create an endpoint POST /ask that starts a conversation or adds a message.Instead of blocking, it should return a message_id and conversation_id.Create a polling endpoint GET /status/{message_id} that checks w.genie.get_message().Status Mapping: Map Genie statuses (STARTING, EXECUTING_QUERY, COMPLETED, FAILED) to UI-friendly progress updates (e.g., 'Genie is thinking', 'Running SQL...').Result Handling: Once status is COMPLETED, retrieve and format the natural language summary (from attachments.text) and the tabular data (using get_message_attachment_query_result).Reliability: >    - Implement exponential backoff for polling (starting at 1s, max 5s).Add a 10-minute timeout for long-running queries.Include error handling for 'unsafe' SQL flags or warehouse connection errors.Feedback Integration: Include a POST /feedback endpoint to send POSITIVE/NEGATIVE ratings back to the Genie space via the SDK for model improvement."Key Technical Implementation Details1. The Async Polling Logic (The "Engine")In production, do not use the _and_wait methods for web requests as they block your server workers. Use the manual poll:Pythonimport time
from databricks.sdk import WorkspaceClient

def poll_genie_message(w: WorkspaceClient, space_id: str, conv_id: str, msg_id: str):
    max_wait = 600 # 10 minutes
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        msg = w.genie.get_message(space_id=space_id, conversation_id=conv_id, message_id=msg_id)
        
        if msg.status.value == "COMPLETED":
            return msg
        elif msg.status.value in ["FAILED", "CANCELLED"]:
            raise Exception(f"Genie failed with status: {msg.status.value}")
        
        # Exponential backoff or simple sleep
        time.sleep(2) 
    raise TimeoutError("Genie query timed out.")
2. Handling "Trusted Assets"In your UI, check the metadata of the response. If Genie uses a Trusted Asset (a pre-verified SQL snippet or Metric View), the API response will include a trusted flag.UI Tip: Display a "Verified" badge next to these responses to increase executive confidence in the data.3. Security LayerData Masking: Do not rely on your custom UI to hide data. Apply Row-Level Security (RLS) in Unity Catalog. Genie will automatically inherit these filters because it runs queries as the authenticated principal.Token Scoping: Ensure your Service Principal only has CAN USE permissions on the specific Genie Space and the Serverless SQL Warehouse—nothing else.4. The "Pseudo-Streaming" UXSince you can't stream tokens, stream State Changes.User sends prompt $\rightarrow$ UI shows "Message Sent".Backend returns Message ID $\rightarrow$ UI shows "Genie is analyzing request".Poll returns EXECUTING_QUERY $\rightarrow$ UI shows "Calculating results on SQL Warehouse...".Poll returns COMPLETED $\rightarrow$ UI renders the table.