 POST /api/chat/cancel 200 in 666ms
 POST /api/chat 200 in 1935ms
Python backend error details: {
  status: 500,
  statusText: 'Internal Server Error',
  errorText: '{"detail":"Failed to process chat request: "}'
}
=== CHAT API REQUEST FAILED ===
Chat API error: Error: Backend error: 500
    at POST (app/api/chat/route.ts:143:12)
  141 |         errorText: errorText
  142 |       })
> 143 |       throw new Error(`Backend error: ${response.status}`)
      |            ^
  144 |     }
  145 |
  146 |     const data = await response.json()
Error stack: Error: Backend error: 500
    at POST (/Users/cameronhightower/Software_Projects/juniper_web/.next/server/chunks/[root-of-the-server]__9b3458c1._.js:493:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async AppRouteRouteModule.do (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js:26:34112)
    at async AppRouteRouteModule.handle (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js:26:41338)
    at async doRender (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/base-server.js:1518:42)
    at async DevServer.renderToResponseWithComponentsImpl (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/base-server.js:1920:28)
    at async DevServer.renderPageComponent (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/base-server.js:2408:24)
    at async DevServer.renderToResponseImpl (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/base-server.js:2445:32)
    at async DevServer.pipeImpl (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/base-server.js:1008:25)
    at async NextNodeServer.handleCatchallRenderRequest (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/next-server.js:305:17)
    at async DevServer.handleRequestImpl (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/base-server.js:900:17)
    at async /Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/dev/next-dev-server.js:371:20
    at async Span.traceAsyncFn (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/trace/trace.js:157:20)
    at async DevServer.handleRequest (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/dev/next-dev-server.js:368:24)
    at async invokeRender (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/lib/router-server.js:237:21)
    at async handleRequest (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/lib/router-server.js:428:24)
    at async requestHandlerImpl (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/lib/router-server.js:452:13)
    at async Server.requestListener (/Users/cameronhightower/Software_Projects/juniper_web/node_modules/next/dist/server/lib/start-server.js:158:13)
