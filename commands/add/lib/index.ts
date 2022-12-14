'use strict';
const Command = require('@mc91-cli-dev/command');

@decorator
class AddCommand extends Command {
  constructor(argv) {
    super(argv);
    console.log(argv);
  }

  init() {
    console.log('add command init');
  }

  exec() {
    console.log('add command');
  }
}

module.exports = add;
module.exports.AddCommand = AddCommand;

function add(...args) {
  //const [name, option, cmd] = args;
  return new AddCommand(args);
}

function decorator(...args) {
  args.forEach((arg, index) => {
    console.log(`参数${index}`, arg);
  });
}
