var fs = require('fs-extra');

module.exports = {
    run: function (options) {
		var generator = options.generator;
		generator.composeWith("html5:dep", { options: { 'install': 'https://services.sungard.com/git/scm/uxl/ux-kendodataviz-dashboard.git#master' } }, function () {
		    console.log('dashboard-installed');
		});
		debugger;
		fs.copy('files', options.directory, function (a, b, c) {
		    debugger;
		    console.log('files copied');
		})
    }
};