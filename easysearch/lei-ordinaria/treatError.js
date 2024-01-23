var errors = require('./errors.json');
const fs = require('fs');

(async () => {
    var errs = [];
    for (var i = 0; i < errors.data.length; i++) {
        var err = errors.data[i];
        var dt = {
            page: parseInt(err.split(' ')[3]),
            row: parseInt(err.split(' ')[5])
        }
        errs.push(dt);
    }

    await fs.writeFileSync('./easysearch/lei-ordinaria/retry.json', JSON.stringify({ data: errs }, null, 4));
})();