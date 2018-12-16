const settings = require('./lib/settings');
const express = require('express'), app = express(), port = settings.port;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const graphQlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Block = require('./models/block');

// MONGOOS CONNECT //
mongoose.connect('mongodb://' + settings.dbsettings.address + ':' + settings.dbsettings.port + '/' + settings.dbsettings.database,
    {
        useCreateIndex: true,
        useNewUrlParser: true,
        auth: {
            user: settings.dbsettings.user,
            password: settings.dbsettings.password
        }
    }).catch(err => {
        console.log(err);
    })
//////////////////////

// PARSERS & LOGGER
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));

// PREVENT CORS ERRORS //
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.methode === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
})

// ROUTES GRAPHQL //
app.use('/graphql', graphQlHttp({
    schema: buildSchema(`
        type Block {
            _id: ID!
            blockNumber: String!
            blockType: String!
            blockHash: String!
            blockTime: String!
            blockTxIds: [String!]!
            blockDifficulty: Float!
            prevBlockHash: String!
            payedPoS: String!
            payedMN: String!
        }

        input BlockInput {
            blockNumber: String!
            blockType: String!
            blockHash: String!
            blockTime: String!
            blockTxIds: [String!]!
            blockDifficulty: Float!
            prevBlockHash: String!
            payedPoS: String!
            payedMN: String!
        }

        type RootQuery {
            blocks: [Block!]!
        }

        type RootMutation {
            createBlock(blockInput: BlockInput): Block
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        blocks: () => {
            return Block
                .find()
                .then(blocks => {
                    //console.log(blocks);
                    return blocks.map(block => {
                        return { ...block._doc, _id: block._doc._id.toString() };
                    })
                })
                .catch(err => {
                    throw err;
                })
        },
        createBlock: (args) => {
            //console.log(args);
            const block = new Block({
                blockNumber: args.blockInput.blockNumber,
                blockType: args.blockInput.blockType,
                blockHash: args.blockInput.blockHash,
                blockTime: args.blockInput.blockTime,
                blockTxIds: args.blockInput.blockTxIds,
                blockDifficulty: args.blockInput.blockDifficulty,
                prevBlockHash: args.blockInput.prevBlockHash,
                payedPoS: args.blockInput.payedPoS,
                payedMN: args.blockInput.payedMN
            })
            return block
                .save()
                .then(result => {
                    return { ...result._doc, _id: block.id };
                }).catch(err => {
                    console.log(err);
                    throw err;
                });
        }
    },
    graphiql: true
}))

app.get('/', (req, res, next) => {
    res.send("mag PoS / MN explorer");
})
////////////

// ERROR HANDLING //
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.send(error.message);
});
////////////////////

// START SERVER //
app.listen(port, () => {
    console.log('mag PoS/MN server started, port: ' + port);
});
//////////////////