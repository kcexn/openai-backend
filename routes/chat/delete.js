const schema = {
  description: 'Delete the chat session.',
  tags: ['OpenAI'],
  summary: 'Delete the chat session.',
  response: {
    204: {
      description: 'Successfully deleted the chat session.',
    },
    500: {
      description: 'Internal Server Error',
      type: 'object',
      properties: {
        error: { type: 'string' },
        details: { type: 'string' },
      },
    },
  },
};

module.exports = async function (app) {
  app.delete('/chat', { schema }, async (request, reply) => {
    try {
      let sessionUuid = request.session.sessionUuid;
      if (sessionUuid) {
        await request.session.destroy();
        reply.clearCookie('sessionId', {
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          sameSite: 'none',
          partitioned: true,
          httpOnly: true,
        });
      }
      return reply.code(204).send();
    } catch (error) {
      app.log.error('Error calling OpenAI:', error.message);
      return reply.code(500).send({ error: 'Failed to delete session.', details: error.message });
    }
  });
};
