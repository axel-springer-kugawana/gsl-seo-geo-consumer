using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace CsFunc.Tests;

public class LambdaShould
{
    [Fact]
    public void ReturnTheCorrectResponse()
    {
        var conf = Substitute.For<IConfiguration>();
        conf["account_name"].Returns("MyAccount");
        conf["team"].Returns("MyTeam");
        conf["planet"].Returns("MyPlanet");
        var options = Substitute.For<IOptionsMonitor<TeamConfig>>();
        options.CurrentValue.Returns(new TeamConfig { Base = "MyBase" });
        var func = new Functions(conf);

        var result = func.Handler(options);

        var expected = new Body
        {
            Message = "Hello MyAccount",
            Team = "MyTeam",
            Planet = "MyPlanet",
            TeamConfig = new TeamConfig
            {
                Base = "MyBase",
            }
        };
        Assert.Equivalent(expected, JsonSerializer.Deserialize<Body>(result.Body));
    }
}
