import os
import logging
from databricks.sdk import WorkspaceClient

# Use basic logging config to capture debug outputs with more verbosity
logging.basicConfig(level=logging.DEBUG)

def test_connection():
    try:
        print("Initializing WorkspaceClient with hardcoded values...")
        w = WorkspaceClient(
            host="https://adb-7405614400395906.6.azuredatabricks.net",
            client_id="8f6c25d3-692d-4ff6-9ac5-0cebd50f760e",
            client_secret="dosead2e3bca196a445418ac4526501a7149"
        )
        
        print("Attempting to reach Databricks backend...")
        try:
            # Force evaluation
            clusters = list(w.clusters.list())
            print(f"Clusters found: {len(clusters)}")
        except Exception as e:
            print(f"Cluster list failed. Error: {e}")
            
        print("Initialization completed without hard crashes.")
    except Exception as ex:
        print(f"CRITICAL ERROR: Failed to configure Databricks SDK. Details:\n{ex}")

if __name__ == "__main__":
    test_connection()
