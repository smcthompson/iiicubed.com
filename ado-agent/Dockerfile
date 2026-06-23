FROM mcr.microsoft.com/dotnet/sdk:8.0-jammy

# Install Node.js 26.x (matches your pipeline)
RUN curl -fsSL https://deb.nodesource.com/setup_26.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Azure Pipelines agent
WORKDIR /azp
RUN curl -LsS https://download.agent.dev.azure.com/agent/4.274.1/vsts-agent-linux-x64-4.274.1.tar.gz -o agent.tar.gz \
    && tar -zxvf agent.tar.gz \
    && rm agent.tar.gz

COPY ./start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]