using System.Net;
using System.Net.Mime;
using System.Text.Json;
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

        var progressiveRollout = new ConfigurationBuilder()
            .AddAppConfig(serviceName, "default", "ProgressiveRollout")
            .Build();
        services.Configure<ProgressiveRollout>(progressiveRollout);
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
    public APIGatewayProxyResponse Handler([FromServices] IOptionsMonitor<ProgressiveRollout> progressiveRollout)
    {
        Body body =
            new()
            {
                Message = $"Hello {_conf["account_name"]}",
                Team = _conf["team"] ?? "",
                Domain = _conf["domain"] ?? "",
                ProgressiveRollout = progressiveRollout.CurrentValue,
            };

        return new APIGatewayProxyResponse
        {
            StatusCode = (int)HttpStatusCode.OK,
            Headers = new Dictionary<string, string> { ["content-type"] = MediaTypeNames.Application.Json },
            Body = JsonSerializer.Serialize(body, LambdaJsonSerializerContext.Default.Body),
        };
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
    public required string Domain { get; init; }
    public required ProgressiveRollout ProgressiveRollout { get; init; }
}

public sealed class ProgressiveRollout
{
    public bool Enabled { get; set; }
    public IReadOnlyCollection<int> WhiteListedIds { get; set; } = Array.Empty<int>();
}
