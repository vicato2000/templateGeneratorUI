const {createProxyMiddleware} = require('http-proxy-middleware');
require('dotenv').config();

module.exports = function (app) {
    app.use(
        '/poet/api/v1',
        createProxyMiddleware({
            target: process.env.URL_POET_API,
            changeOrigin: true,
            secure: false,
            pathRewrite: {
                '^/poet/api/v1': '/api/v1',
            }
        })
    );

    app.use(
        '/eva/api/v1',
        createProxyMiddleware({
            target: process.env.URL_EVA_API,
            changeOrigin: true,
            secure: false,
            pathRewrite: {
                '^/eva/api/v1': '/api/v1',
            }
        })
    );

    app.use(
        '/genie/api/v1/models/ollama',
        createProxyMiddleware({
            target: process.env.URL_GENIE_API,
            changeOrigin: true,
            secure: false,
            pathRewrite: {
                '^/genie/api/v1/models/ollama': '/api/v1/models/ollama',
            }
        })
    );

    app.use(
        '/genie/api/v1/models',
        createProxyMiddleware({
            target: process.env.URL_GENIE_API,
            changeOrigin: true,
            secure: false,
            pathRewrite: {
                '^/genie/api/v1/models': '/api/v1/models',
            }
        })
    );
};
