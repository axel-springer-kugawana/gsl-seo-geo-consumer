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
        conf["domain"].Returns("MyDomain");
        var options = Substitute.For<IOptionsMonitor<ProgressiveRollout>>();
        options.CurrentValue.Returns(new ProgressiveRollout { Enabled = true });
        var func = new Functions(conf);

        var result = func.Handler(options);

        var expected = new Body
        {
            Message = "Hello MyAccount",
            Team = "MyTeam",
            Domain = "MyDomain",
            ProgressiveRollout = new ProgressiveRollout
            {
                Enabled = false,
            }
        };
        Assert.Equivalent(expected, JsonSerializer.Deserialize<Body>(result.Body));
    }
}
