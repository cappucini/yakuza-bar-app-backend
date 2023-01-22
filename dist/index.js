import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import pkg from 'rand-token';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PubSub } from 'graphql-subscriptions';
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const { uid } = pkg;
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Hostess" type defines the queryable fields for every hostess in our data source.
  type Hostess {
    id: Int
    name: String
    price: Int
    likes: String
    dislikes: String
    description: String
    imageUrl: String
    hostessClub: String
    bookingStatus: Int
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "hostess" query returns an array of zero or more Hostess (defined above).
  type Query {
    hostesses: [Hostess]
  }


  type Query {
    hostess(id: Int): [Hostess]

  }

 
  interface MutationResponse {
    code: String!
    success: Boolean!
    message: String!
  }


  type UpdateHostessBookingMutationResponse implements MutationResponse {
    code: String!
    success: Boolean!
    message: String!
  }


  # Mutation 
  type Mutation {
    bookHostess(id: Int!): UpdateHostessBookingMutationResponse
  }

  type Subscription{
    hostessBooked: Hostess
  }


`;
const hostess_1 = {
    id: 1,
    name: "Lin Lin",
    price: 25000,
    likes: "Anything alcoholic",
    dislikes: "Greasy food",
    description: "No. 1 hostess at Lin Lin. She says sharing her name with the bar is a coincidence, but she represents the place.",
    imageUrl: 'Lin_Lin.png',
    hostessClub: 'LIN_LIN',
    bookingStatus: 0
};
const hostess_2 = {
    id: 2,
    name: "Xian Xian",
    price: 18000,
    likes: "Oolong tea",
    dislikes: "Carbs",
    description: "Popular hostess at the bar. Her expression can be dark, but that fragility keeps customers coming in for her.",
    imageUrl: 'Xian_Xian.png',
    hostessClub: 'LIN_LIN',
    bookingStatus: 0
};
const hostess_3 = {
    id: 3,
    name: "Nian",
    price: 10000,
    likes: "Sweet and Sour Pork (with pineapple)",
    dislikes: "Anything alcoholic",
    description: "No. 1 among the younger hostesses, she talks like a gyaru to appeal to older men. Her older sister works at the same place.",
    imageUrl: 'Nian.png',
    hostessClub: 'LIN_LIN',
    bookingStatus: 0
};
const hostess_4 = {
    id: 4,
    name: "Fang",
    price: 7500,
    likes: "Noodles",
    dislikes: "Rice",
    description: "A popular hostess. She used to work in the shopping districts in Tokyo. Her experience is the secret to her popularity.",
    imageUrl: 'Fang.png',
    hostessClub: 'LIN_LIN',
    bookingStatus: 0
};
const hostess_5 = {
    id: 5,
    name: "Margarita",
    price: 6000,
    likes: "Spicy food",
    dislikes: "Anything sweet",
    description: "A popular younger hostess. With her light and playful attitude, she brightens up even the darkest of places. Margarita is just a working name, of course.",
    imageUrl: 'Margarita.png',
    hostessClub: 'LIN_LIN',
    bookingStatus: 0
};
const hostess_6 = {
    id: 6,
    name: "Jiang",
    price: 4000,
    likes: "Anything alcoholic",
    dislikes: "None",
    description: "Hostess brimming with adult allure. She works hard at pleasing guests in order to take care of her children.",
    imageUrl: 'Jiang.png',
    hostessClub: 'LIN_LIN',
    bookingStatus: 0
};
const hostess_7 = {
    id: 7,
    name: "Yuen",
    price: 3000,
    likes: "Shrimp dishes",
    dislikes: "Pineapples in the Sweet and Sour Pork",
    description: "A student hostess that goes to a college in Yokohama and is paying her own way through it. Her younger sister also works at the same place.",
    imageUrl: 'Yuen.png',
    hostessClub: 'LIN_LIN',
    bookingStatus: 0
};
const hostess_data = [
    hostess_1,
    hostess_2,
    hostess_3,
    hostess_4,
    hostess_5,
    hostess_6,
    hostess_7
];
export const pubsub = new PubSub();
const resolvers = {
    Query: {
        hostesses: () => hostess_data,
        hostess(parents, args, contextValue, info) {
            console.log("resolving hostess with argument" + args.id);
            return hostess_data.filter(h => h.id === args.id);
        }
    },
    Subscription: {
        hostessBooked: {
            subscribe: () => pubsub.asyncIterator(['HOSTESS_BOOKED'])
        },
    },
    Mutation: {
        bookHostess: (parents, args, contextValue, info) => {
            // change data
            var hostess = hostess_data.find(h => h.id === args.id);
            hostess.bookingStatus = 1;
            console.log("hostess in mutation is " + JSON.stringify(hostess));
            pubsub.publish('HOSTESS_BOOKED', {
                hostessBooked: hostess
            });
            return {
                code: 'Yo',
                success: true,
                message: "Booked",
            };
        }
    },
    // ...other resolvers...
};
// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });
// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
// const server = new ApolloServer<MyContext>({
//   typeDefs,
//   resolvers,
//   plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
//   csrfPrevention: false ,
// });
// Creating the WebSocket server
const wsServer = new WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: '/graphql',
    // path: '/subscriptions',
});
// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({ schema }, wsServer);
// ...
const server = new ApolloServer({
    schema,
    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        // Proper shutdown for the WebSocket server.
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
    csrfPrevention: false,
    formatError: (formattedError, _) => {
        return formattedError;
    }
});
// Ensure we wait for our server to start
await server.start();
// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use('/graphql', cors(), bodyParser.json(), 
// expressMiddleware accepts the same arguments:
// an Apollo Server instance and optional configuration options
expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.token }),
}));
// Cors allows cross origin requests, from this server to localhost client. In the pre flight check, the server will 
// allow any time of cross origin request. 
app.use('/login', cors(), express.json(), (req, res) => {
    console.log(req.headers);
    console.log(req.body);
    if (req.body.username === "erica" && req.body.password === "yakuza") {
        const token = uid(12);
        res.send({ token: token });
    }
    else {
        res.status(401).send({ message: "Sorry, you are not authorized to see this." });
    }
});
// Modified server startup
await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000/`);
