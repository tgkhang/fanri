import { Command } from "commander";
import { serveCommand } from "./commands/serve.command";

const program = new Command()
  .name("fanri")
  .description("See your Terraform. Local-first infrastructure diagrams.")
  .version("0.0.0");

program
  .argument("[path]", "Terraform root folder", ".")
  .option("-p, --port <port>", "port to listen on (default: random free port)", Number)
  .option("--no-open", "do not open the browser")
  .option("--dev", "development mode: UI is served by Vite on :5173")
  .action(serveCommand);

await program.parseAsync();
