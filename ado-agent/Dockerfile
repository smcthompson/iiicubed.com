# Base from official Playwright (includes Node + browsers + deps)
FROM mcr.microsoft.com/playwright:v1.61.0-noble

# Install Node.js 26.x (matches your pipeline)
RUN apt-get update \
  && apt-get install -y curl ca-certificates gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_26.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install Azure Pipelines agent
WORKDIR /azp
RUN curl -LsS https://download.agent.dev.azure.com/agent/4.274.1/vsts-agent-linux-x64-4.274.1.tar.gz -o agent.tar.gz \
  && tar -zxvf agent.tar.gz \
  && rm agent.tar.gz

COPY ./start.sh /azp/start.sh
RUN sed -i 's/\r$//' /azp/start.sh \
  && chmod +x /azp/start.sh

ENV NODE_NO_WARNINGS=1

CMD ["/azp/start.sh"]