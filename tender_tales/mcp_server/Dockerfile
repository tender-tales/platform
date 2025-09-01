FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir uv

COPY . .

RUN uv sync --dev

ARG MCP_PORT
ENV MCP_PORT=${MCP_PORT}

# Print port values
RUN echo "MCP_PORT: ${MCP_PORT}"

EXPOSE ${MCP_PORT}

# Use shell form to ensure environment variable expansion
CMD sh -c "uv run python main.py"
