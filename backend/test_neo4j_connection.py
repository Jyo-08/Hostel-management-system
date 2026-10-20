"""
HostelOS BACSE202 DA3 - Phase 1 Connection Test Script
Tests connectivity to Neo4j database using the official Python driver and environment variables.
"""

import os
from dotenv import load_dotenv
from neo4j import GraphDatabase, exceptions

# Load environment variables
load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

def test_connection():
    print("=" * 60)
    print("HOSTELOS NEO4J CONNECTION TEST (BACSE202 DA3)")
    print("=" * 60)
    print(f"Target URI : {NEO4J_URI}")
    print(f"User       : {NEO4J_USER}")
    print(f"Password   : {'*' * len(NEO4J_PASSWORD) if NEO4J_PASSWORD else 'NOT SET'}")

    if not NEO4J_PASSWORD:
        print("[FAIL] NEO4J_PASSWORD is not set in environment or .env file.")
        return False

    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        driver.verify_connectivity()
        print("[SUCCESS] Driver verified connectivity to Neo4j instance.")

        with driver.session() as session:
            result = session.run("""
                CALL dbms.components() YIELD name, versions, edition
                RETURN name, versions[0] AS version, edition
            """).single()
            if result:
                print(f"[SUCCESS] DBMS Name    : {result['name']}")
                print(f"[SUCCESS] Version      : {result['version']}")
                print(f"[SUCCESS] Edition      : {result['edition']}")

            # Check database state
            db_res = session.run("SHOW DEFAULT DATABASE YIELD name, currentStatus").single()
            if db_res:
                print(f"[SUCCESS] Default DB   : {db_res['name']} (Status: {db_res['currentStatus']})")

        driver.close()
        print("[SUCCESS] Neo4j environment is ready for Phase 2 graph modeling.")
        print("=" * 60)
        return True

    except exceptions.AuthError as e:
        print(f"[ERROR] Authentication failed: {e}")
        return False
    except exceptions.ServiceUnavailable as e:
        print(f"[ERROR] Service unavailable at {NEO4J_URI}: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    exit(0 if success else 1)
