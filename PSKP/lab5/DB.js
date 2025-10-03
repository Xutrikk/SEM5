const EventEmitter = require('events');

class DB extends EventEmitter {
    constructor() {
        super();
        this.data = [
            { id: 1, name: "Иван Иванов", bday: "1990-01-01" },
            { id: 2, name: "Петр Петров", bday: "1985-05-15" }
        ];
        this.nextId = 3;
        this.commitCount = 0;
    }

    select() {
        return new Promise((resolve) => {
            setImmediate(() => {
                this.emit('GET', this.data);
                resolve([...this.data]);
            });
        });
    }

    insert(row) {
        return new Promise((resolve, reject) => {
            if (!row.name || !row.bday) {
                setImmediate(() => {
                    this.emit('POST_ERROR', 'Необходимо указать name и bday');
                    reject(new Error('Необходимо указать name и bday'));
                });
                return;
            }

            const newRow = {
                id: this.nextId++,
                name: row.name,
                bday: row.bday
            };

            this.data.push(newRow);
            
            setImmediate(() => {
                this.emit('POST', newRow);
                resolve({...newRow});
            });
        });
    }

    update(row) {
        return new Promise((resolve, reject) => {
            if (!row.id) {
                setImmediate(() => {
                    this.emit('PUT_ERROR', 'Необходимо указать id');
                    reject(new Error('Необходимо указать id'));
                });
                return;
            }

            const index = this.data.findIndex(item => item.id === row.id);
            
            if (index === -1) {
                setImmediate(() => {
                    this.emit('PUT_ERROR', `Запись с id=${row.id} не найдена`);
                    reject(new Error(`Запись с id=${row.id} не найдена`));
                });
                return;
            }

            this.data[index] = {...this.data[index], ...row};
            
            setImmediate(() => {
                this.emit('PUT', this.data[index]);
                resolve({...this.data[index]});
            });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            const index = this.data.findIndex(item => item.id === id);
            
            if (index === -1) {
                setImmediate(() => {
                    this.emit('DELETE_ERROR', `Запись с id=${id} не найдена`);
                    reject(new Error(`Запись с id=${id} не найдена`));
                });
                return;
            }

            const deletedRow = this.data.splice(index, 1)[0];
            
            setImmediate(() => {
                this.emit('DELETE', deletedRow);
                resolve({...deletedRow});
            });
        });
    }

    commit() {
        return new Promise((resolve) => {
            setImmediate(() => {
                this.commitCount++;
                this.emit('COMMIT', { commitCount: this.commitCount });
                resolve({ commitCount: this.commitCount });
            });
        });
    }
}

module.exports = DB;