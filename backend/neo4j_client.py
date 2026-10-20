"""
Neo4j Graph Database Client & Knowledge Graph Provider
Authoritative data access layer for HostelOS BACSE202 DA3.
Author: Jyotish N (25BAI1176) — VIT Chennai
"""

import os
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional
from neo4j import GraphDatabase, Driver

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")


class Neo4jManager:
    def __init__(self):
        self.driver: Optional[Driver] = None
        self.is_connected = False
        self._init_driver()

    def _init_driver(self):
        try:
            self.driver = GraphDatabase.driver(
                NEO4J_URI,
                auth=(NEO4J_USER, NEO4J_PASSWORD),
                max_connection_lifetime=3600,
                max_connection_pool_size=50,
                connection_acquisition_timeout=10.0
            )
            self.driver.verify_connectivity()
            self.is_connected = True
        except Exception as e:
            self.is_connected = False
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()
            self.is_connected = False

    def check_connection(self) -> Dict[str, Any]:
        if not self.driver:
            self._init_driver()
        if self.driver:
            try:
                self.driver.verify_connectivity()
                with self.driver.session() as session:
                    res = session.run("RETURN 1 AS ping").single()
                    if res and res["ping"] == 1:
                        self.is_connected = True
                        return {
                            "connected": True,
                            "uri": NEO4J_URI,
                            "mode": "Neo4j Bolt Live (Authoritative)",
                            "database": "Neo4j Community"
                        }
            except Exception as e:
                self.is_connected = False
                return {
                    "connected": False,
                    "uri": NEO4J_URI,
                    "error": str(e),
                    "mode": "Disconnected"
                }
        return {"connected": False, "uri": NEO4J_URI, "mode": "Disconnected"}

    def run_query(self, cypher: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if not self.driver or not self.is_connected:
            self._init_driver()
            if not self.driver or not self.is_connected:
                raise RuntimeError("Neo4j database service is unavailable.")

        with self.driver.session() as session:
            result = session.run(cypher, params or {})
            return [dict(record) for record in result]

    def run_single(self, cypher: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        rows = self.run_query(cypher, params)
        return rows[0] if rows else None

    def execute_write(self, cypher: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if not self.driver or not self.is_connected:
            self._init_driver()
            if not self.driver or not self.is_connected:
                raise RuntimeError("Neo4j database service is unavailable.")

        def _work(tx):
            res = tx.run(cypher, params or {})
            return [dict(record) for record in res]

        with self.driver.session() as session:
            return session.execute_write(_work)

    def get_full_graph(self) -> Dict[str, Any]:
        """
        Query the live property graph directly from Neo4j Cypher.
        Returns nodes and links formatted for the React frontend graph visualizer.
        """
        if not self.driver or not self.is_connected:
            self._init_driver()
            if not self.driver or not self.is_connected:
                raise RuntimeError("Neo4j database service is unavailable.")

        with self.driver.session() as session:
            # 1. Fetch all nodes
            cypher_nodes = """
            MATCH (n)
            RETURN elementId(n) AS id,
                   head(labels(n)) AS label,
                   coalesce(
                       n.student_name,
                       n.hostel_name,
                       n.block_name,
                       CASE WHEN n.room_no IS NOT NULL THEN 'Room ' + n.room_no ELSE NULL END,
                       n.warden_name,
                       n.staff_name,
                       n.receipt_number,
                       n.name,
                       n.issue_type,
                       n.category,
                       'Graph Node'
                   ) AS name,
                   properties(n) AS properties
            ORDER BY label, name
            """
            nodes_res = session.run(cypher_nodes).data()
            nodes = []
            for r in nodes_res:
                nodes.append({
                    "id": r["id"],
                    "label": r["label"],
                    "name": r["name"],
                    "properties": r["properties"]
                })

            # 2. Fetch all relationships
            cypher_links = """
            MATCH (s)-[r]->(t)
            RETURN elementId(r) AS id,
                   elementId(s) AS source,
                   elementId(t) AS target,
                   type(r) AS type,
                   properties(r) AS properties
            ORDER BY type
            """
            links_res = session.run(cypher_links).data()
            links = []
            for r in links_res:
                links.append({
                    "id": r["id"],
                    "source": r["source"],
                    "target": r["target"],
                    "type": r["type"],
                    "properties": r["properties"]
                })

            return {
                "nodes": nodes,
                "links": links,
                "engine": f"Neo4j Bolt Live ({NEO4J_URI}) — BACSE202 DA3 Knowledge Graph"
            }


neo4j_manager = Neo4jManager()
