# SmartLoad Optimization API
## How to run
```bash
git clone <your-repo>
cd <folder>
docker compose up --build
Service will be available at http://localhost:8080
```
# Health check
```bash
curl http://localhost:8080/actuator/health # or /healthz if you use
Go/Node
```

# Example request
```bash
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
-H "Content-Type: application/json" \
-d @sample-request.json
```