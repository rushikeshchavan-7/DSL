# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files from root repository context
COPY ["platform/src/Platform.Api/Platform.Api.csproj", "src/Platform.Api/"]
COPY ["platform/src/Platform.Domain/Platform.Domain.csproj", "src/Platform.Domain/"]
COPY ["platform/src/Platform.Metadata/Platform.Metadata.csproj", "src/Platform.Metadata/"]
COPY ["platform/src/Platform.Engine/Platform.Engine.csproj", "src/Platform.Engine/"]
COPY ["platform/src/Platform.Etl/Platform.Etl.csproj", "src/Platform.Etl/"]

RUN dotnet restore "src/Platform.Api/Platform.Api.csproj"

# Copy all platform source code and publish
COPY platform/src/ src/
WORKDIR "/src/src/Platform.Api"
RUN dotnet publish "Platform.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5100
EXPOSE 5100

ENTRYPOINT ["dotnet", "Platform.Api.dll"]
