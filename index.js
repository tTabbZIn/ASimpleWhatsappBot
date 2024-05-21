const fs = require('fs');
const wppconnect = require('@wppconnect-team/wppconnect');


class User {
    constructor(number, state, request = '', total = 0) {
        this.number = number;
        this.state = state;
        this.request = request;
        this.total = total;
    }
}




let usuarios = [];

wppconnect
    .create({
        session: 'sessionName',
        catchQR: (base64Qr, asciiQR) => {
            console.log(asciiQR);
            var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
                response = {};

            if (matches.length !== 3) {
                return new Error('Invalid input string');
            }
            response.type = matches[1];
            response.data = Buffer.from(matches[2], 'base64');

            fs.writeFile('out.png', response.data, 'binary', function (err) {
                if (err != null) {
                    console.log(err);
                }
            });
        },
        logQR: false,
    })
    .then((client) => start(client))
    .catch((error) => console.log(error));

function start(client) {
    console.log(usuarios);

    client.onMessage((message) => {
        const userNumber = message.from;
        const messageBody = message.body.toLowerCase();

        let user = usuarios.find(u => u.number === userNumber);

        if (user) {
            handleMessage(client, message, user, messageBody);
        } else {
            const newUser = new User(userNumber, "state1");
            usuarios.push(newUser);
            sendWelcomeMessage(client, message);
        }
    });
}

function handleMessage(client, message, user, messageBody) {
    switch (user.state) {
        case 'state1':
            handleState1(client, message, user, messageBody);
            break;
        case 'pedindo':
            handlePedindo(client, message, user, messageBody);
            break;
        case 'finalizando':
            handleFinalizando(client, message, user, messageBody);
            break;
        case 'complemento':
            handleComplemento(client, message, user, messageBody);
            break;
        case 'bebida':
            handleBebida(client, message, user, messageBody);
            break;
        case 'duvida':
            handleDuvida(client, message, user);
            break;
        case 'endereco':
            handleEndereco(client, message, user, messageBody);
            break;
        default:
            sendDefaultMessage(client, message);
            break;
    }
}



function handleState1(client, message, user, messageBody) {
    if (messageBody === '1') {
        user.state = 'pedindo';
        pedido(client, message);
    } else if (messageBody === '2') {
        user.state = 'duvida';
        atendimento(client, message);
    }
}

function handlePedindo(client, message, user, messageBody) {
    const menuOptions = {
        '1': { name: 'Pequena', price: 20 },
        '2': { name: 'Grande', price: 23 },
        '3': { name: 'PequenaMistura', price: 30 },
        '4': { name: 'GrandeMistura', price: 40 }
    };

    if (menuOptions[messageBody]) {
        user.request += `1 ${menuOptions[messageBody].name}\n`;
        user.total += menuOptions[messageBody].price;
        user.state = 'finalizando';
        cardapio(client, message);
    }
}

function handleFinalizando(client, message, user, messageBody) {
    if (messageBody !== 'ajuda') {
        user.request += message.body + "\n";
        client.sendText(
            message.from,
            'Mais alguma coisa? \n\n*1- Gostaria de mais uma marmita*\n*2- Gostaria de uma bebida*\n*3- Só isso mesmo*'
        ).catch((error) => {
            console.error('Error when sending: ', error);
        });
        user.state = "complemento";
    } else {
        user.state = 'duvida';
        atendimento(client, message);
    }
}




function handleComplemento(client, message, user, messageBody) {
    if (messageBody === '1') {
        user.state = 'pedindo';
        pedido(client, message);


    } else if (messageBody === '2') {
        user.state = 'bebida';

        client.sendText(
        
            message.from,
            '*1: Coca lata: R$6,00*\n*2: Guaraná 350ml: R$3,00*\n*3: Soda 350ml: R$3,00*\n*4: Guaraná 2l: R$9,00*\n*5: Soda 2l: R$9,00*\n*6: Água sem gás: R$4,00*\n*7: Água com gás: R$4,50*'
       
        ).catch((error) => {
            console.error('Error when sending: ', error);
        });
    } else if (messageBody === '3') {
        user.state = 'endereco';
        client.sendText(
            message.from,
            'Qual o endereço para entrega?'
        ).catch((error) => {
            console.error('Error when sending: ', error);
        });
    }
}



function handleBebida(client, message, user, messageBody) {
    const bebidaOptions = {
        '1': { name: 'Coca lata', price: 6 },
        '2': { name: 'Guaraná 350ml', price: 3 },
        '3': { name: 'Soda 350ml', price: 3 },
        '4': { name: 'Guaraná 2l', price: 9 },
        '5': { name: 'Soda 2l', price: 9 },
        '6': { name: 'Água sem gás', price: 4 },
        '7': { name: 'Água com gás', price: 4.5 }
    };

    if (bebidaOptions[messageBody]) {
        user.request += `${bebidaOptions[messageBody].name}: R$${bebidaOptions[messageBody].price}\n`;
        user.total += bebidaOptions[messageBody].price;
        user.state = 'finalizando';
        client.sendText(
            message.from,
            'Bebida adicionada ao pedido. Deseja adicionar mais alguma coisa? \n\n*1- Gostaria de mais uma marmita*\n*2- Gostaria de uma bebida*\n*3- Só isso mesmo*'
        ).catch((error) => {
            console.error('Error when sending: ', error);
        });
    } else {

        client.sendText(
            message.from,
            'Opção inválida. Por favor, escolha uma bebida válida:\n*1: Coca lata: R$6,00*\n*2: Guaraná 350ml: R$3,00*\n*3: Soda 350ml: R$3,00*\n*4: Guaraná 2l: R$9,00*\n*5: Soda 2l: R$9,00*\n*6: Água sem gás: R$4,00*\n*7: Água com gás: R$4,50*'
        ).catch((error) => {
            console.error('Error when sending: ', error);
        });
    }
}

function handleDuvida(client, message, user) {
    console.log(usuarios);
    client.sendText(
        message.from,
        '*Aguarde, o atendente já irá lhe responder*'
    ).catch((error) => {
        console.error('Error when sending: ', error);
    });
}

function handleEndereco(client, message, user, messageBody) {
    user.request += `Endereço: ${messageBody}\n`;
    user.state = 'concluido';
    client.sendText(
        message.from,
        `Pedido concluído! Em breve entraremos em contato para confirmação.\n\nResumo do pedido:\n${user.request}\nTotal: R$${user.total.toFixed(2)}`
    ).catch((error) => {
        console.error('Error when sending: ', error);
    });
}

function sendWelcomeMessage(client, message) {
    client.sendText(
        message.from,
        'Bom dia, sou o assistente do restaurante *NOME* 😁.\n' +
        'Como posso te ajudar?\n\n' +
        'Digite o número referente ao que gostaria:\n\n' +
        '*1: Fazer um pedido*\n' +
        '*2: Tirar alguma dúvida*\n'
    ).catch((error) => {
        console.error('Error when sending: ', error);
    });
}

function pedido(client, message) {
    client.sendText(
        message.from,
        'O que gostaria?\n' +
        '*1: Marmita pequena: R$20,00*\n' +
        '*2: Marmita grande: R$23,00*\n' +
        '*3: Pequena apenas mistura R$30,00*\n' +
        '*4: Grande apenas mistura: R$40,00*\n'
    ).catch((error) => {
        console.error('Error when sending: ', error);
    });
}

function cardapio(client, message) {
    client.sendText(
        message.from,
        'Monte sua marmita\n\n' +
        '*Um tipo de arroz*\n*Um tipo de feijão*\n*Duas misturas*\n*Dois acompanhamentos*\n\n' +
        '*Favor digitar o pedido inteiro dentro de uma mensagem*\n\n' +
        'Caso esteja com dificuldades digite *"AJUDA"*, para falar com o atendente.'
    ).catch((error) => {
        console.error('Error when sending: ', error);
    });
}

function atendimento(client, message) {
    client.sendText(
        message.from,
        'Aguarde, o atendente já irá lhe responder'
    ).catch((error) => {
        console.error('Error when sending: ', error);
    });
}

function sendDefaultMessage(client, message) {
    client.sendText(
        message.from,
        'Não entendi sua mensagem. Por favor, escolha uma opção válida.'
    ).catch((error) => {
        console.error('Error when sending: ', error);
    });
}
