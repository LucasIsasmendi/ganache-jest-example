const path = require("path");
const fs = require("fs");
const solc = require("solc");

const compile = filename => {
  const sourcePath = path.join(__dirname, filename);
  const fileContent = fs.readFileSync(sourcePath, { encoding: "utf8" });
  const input = {
    sources: {
      [sourcePath]: {
        content: fileContent,
      },
    },
    language: "Solidity",
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const artifact = output.contracts[sourcePath];
  return artifact;
};

module.exports = compile;
