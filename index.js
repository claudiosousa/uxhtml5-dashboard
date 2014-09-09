module.exports = {
    run: function (options) {
		var generator = options.generator;
        generator.composeWith("html5:dep", { options: { 'install': 'https://services.sungard.com/git/scm/uxl/ux-dashboard-workspace.git#master' } });
    }
};
console.log('dashboard\\indes.js1')
//throw "Test"