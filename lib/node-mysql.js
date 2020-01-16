var mysql = require('mysql');
var conn;

module.exports = {
    _host:'',
    _user:'',
    _password:'',
    _port:'',
    _database:'',
    _config:function(opt){
        if(typeof(opt['host']) == 'undefined' || typeof(opt['user']) == 'undefined' || typeof(opt['password']) == 'undefined' || typeof(opt['database']) == 'undefined'){
            return false;
        }
        if(typeof(opt['port']) == 'undefined'){
            opt.port = 3306;
        }
        this._host = opt.host;
        this._port = opt.port;
        this._user = opt.user;
        this._password = opt.password;
        this._database = opt.database;
        return true;
    },
    conn:function(opt){
        let result = this._config(opt);
        if(!result){
            throw new Error('Not enough parameters');
        }
        conn = mysql.createConnection({
            host: this._host,
            user: this._user,
            password: this._password,
            port: this._port,
            database: this._database
        });
        conn.connect();
    },
    // this is for pool connection
    // {
    //     connectionLimit : 10,
    //     host            : 'example.org',
    //     user            : 'bob',
    //     password        : 'secret',
    //     database        : 'my_db'
    //   }
    pool:function(opt){
        conn = mysql.createPool(opt);
    },
    s_table: '',
    s_field: '',
    s_order: '',
    s_group: '',
    s_where: '',
    s_limit: '',
    last_sql:'',
    table: function (table) {
        this.s_table = table;
        return this;
    },
    field: function (field) {
        this.s_field = field;
        return this;
    },
    order: function (order) {
        this.s_order = order;
        return this;
    },
    limit: function (start, limit) {
        if (limit == undefined) {
            this.s_limit = start;
        } else {
            this.s_limit = start + ',' + limit;
        }
        return this;
    },
    where: function (where) {
        var where_str = '';
        if (typeof(where) === 'string') {
            where_str += where;
        }
        if (typeof(where) === 'object') {
            var where_arr = [];
            for (var k in where) {
                where_arr.push(k + '=\'' + where[k]+'\'');
            }
            where_str += where_arr.join(' and ');
        }
        this.s_where = where_str;
        return this;
    },
    genSql: function () {

        if (this.s_field === '') {
            this.s_field = '*';
        }

        var sql = 'SELECT ' + this.s_field + ' FROM ' + this.s_table;
        if (this.s_where.length > 0) {
            sql += ' WHERE ' + this.s_where;
        }

        if (this.s_order.length > 0) {
            sql += ' ORDER BY ' + this.s_order;
        }

        if (this.s_group.length > 0) {
            sql += 'GROUP BY ' + this.s_group;
        }

        if (this.s_limit.length > 0) {
            sql += ' LIMIT ' + this.s_limit;
        }
        this.last_sql = sql;
        return sql;
    },
    clear: function () {
        this.s_table = '';
        this.s_field = '';
        this.s_order = '';
        this.s_group = '';
        this.s_where = '';
        this.s_limit = '';
    },
    find: function (cb) {
        var sql = this.genSql();
        this.clear();
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                cb(false);
            } else {
                cb(result[0]);
            }
        });
    },
    select: function (cb) {
        var sql = this.genSql();
        this.clear();
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                cb(false);
            } else {
                cb(result);
            }
        });
    },

    add: function (data, cb) {
        var fields = [];
        var values = [];
        var param = [];
        var _this = this;
        for (var k in data) {
            fields.push('`' + k + '`');
            param.push('?');
            values.push(data[k]);
        }
        var sql = 'INSERT INTO ' + this.s_table + ' (' + fields.join(',') + ') ' + 'values (' + param.join(',') + ')';
        if(cb == undefined){
            cb = function(){};
        }
        this.last_sql = sql;
        conn.query(sql, values, function (err, result) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                cb(false);
            } else {
                cb(result.insertId);
            }
            _this.clear();
        });
    },

    save: function (data, cb) {
        var arr = [];
        var values = [];
        var _this = this;
        for (var k in data) {
            arr.push(k + '=?');
            values.push(data[k]);
        }
        var sql = 'UPDATE ' + this.s_table + ' SET ' + arr.join(',') + ' WHERE ' + this.s_where;
        if(cb == undefined){
            cb = function(){};
        }
        this.last_sql = sql;
        conn.query(sql, values, function (err, result) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                cb(false);
            } else {
                cb(result.affectedRows);
            }
            _this.clear();
        });
    }
};