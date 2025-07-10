FROM mcr.microsoft.com/powershell:7.3-alpine-3.16

RUN pwsh -Command "Install-Module -Name Az -Force -Scope AllUsers"
RUN pwsh -Command "Install-Module -Name ExchangeOnlineManagement -Force -Scope AllUsers"

ENTRYPOINT ["pwsh"] 