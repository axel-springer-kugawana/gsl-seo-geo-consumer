using System.Text.Json.Serialization;
using Amazon.Lambda.Annotations;
using Amazon.Lambda.Annotations.APIGateway;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Lambda.Serialization.SystemTextJson;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

[assembly: LambdaGlobalProperties(GenerateMain = true)]
[assembly: LambdaSerializer(typeof(SourceGeneratorLambdaJsonSerializer<CsFunc.LambdaJsonSerializerContext>))]

namespace CsFunc;

[LambdaStartup]
public sealed class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        var serviceName = Environment.GetEnvironmentVariable("POWERTOOLS_SERVICE_NAME");

        var config = new ConfigurationBuilder()
            .AddSystemsManager("/aft/account-request/custom-fields/")
            .AddEnvironmentVariables("APP_")
            .Build();
        services.AddSingleton<IConfiguration>(config);

        var teamConfig = new ConfigurationBuilder()
            .AddAppConfig(serviceName, "default", config["team"])
            .Build();
        services.Configure<TeamConfig>(teamConfig);
    }
}

public sealed class Functions
{
    private readonly IConfiguration _conf;

    public Functions(IConfiguration conf)
    {
        _conf = conf;
    }

    [LambdaFunction]
    [RestApi(LambdaHttpMethod.Get, "/")]
    public IHttpResult Handler([FromServices] IOptionsMonitor<TeamConfig> teamConfig)
    {
        Body body =
            new()
            {
                Message = $"Hello {_conf["account_name"]}",
                Team = _conf["team"] ?? "",
                Planet = _conf["planet"] ?? "",
                TeamConfig = teamConfig.CurrentValue,
            };

        return HttpResults.Ok(body);
    }
}

[JsonSerializable(typeof(APIGatewayProxyRequest))]
[JsonSerializable(typeof(APIGatewayProxyResponse))]
[JsonSerializable(typeof(Body))]
public partial class LambdaJsonSerializerContext : JsonSerializerContext { }

public sealed class Body
{
    public required string Message { get; init; }
    public required string Team { get; init; }
    public required string Planet { get; init; }
    public required TeamConfig TeamConfig { get; init; }
}

public sealed class TeamConfig
{
    public string Base { get; set; } = null!;
    public IReadOnlyCollection<string> Members { get; set; } = Array.Empty<string>();
}
