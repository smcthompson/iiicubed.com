# Base from official Playwright (includes Node + browsers + deps)
FROM mcr.microsoft.com/playwright:v1.61.0-noble

# Install Azure DevOps agent requirements
RUN apt-get update && apt-get install -y \
    curl \
    git \
    jq \
    libicu74 \
    && rm -rf /var/lib/apt/lists/*

# Set up ADO agent (standard pattern)
WORKDIR /azp

RUN curl -LsS https://download.agent.dev.azure.com/agent/4.274.1/vsts-agent-linux-x64-4.274.1.tar.gz -o agent.tar.gz \
    && tar -zxvf agent.tar.gz \
    && rm agent.tar.gz

COPY ./start.sh .
RUN chmod +x start.sh

ENV AGENT_ALLOW_RUNASROOT=true

CMD ["./start.sh"]