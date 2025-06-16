// Mock conversation management - in a real implementation, this would interact with Tetika's storage system
const conversations = new Map();

export async function manageConversation(args) {
  const { action, session_id, title, search_term, limit = 10 } = args;

  try {
    switch (action) {
      case 'create':
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newSession = {
          id: newSessionId,
          title: title || 'New Conversation',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        conversations.set(newSessionId, newSession);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'create',
                session: newSession,
                message: 'Conversation created successfully',
              }, null, 2),
            },
          ],
        };

      case 'list':
        const allSessions = Array.from(conversations.values())
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'list',
                total: conversations.size,
                limit,
                sessions: allSessions.map(session => ({
                  id: session.id,
                  title: session.title,
                  message_count: session.messages.length,
                  createdAt: session.createdAt,
                  updatedAt: session.updatedAt,
                })),
              }, null, 2),
            },
          ],
        };

      case 'get':
        if (!session_id) {
          throw new Error('Session ID is required for get action');
        }
        
        const session = conversations.get(session_id);
        if (!session) {
          throw new Error(`Session not found: ${session_id}`);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'get',
                session,
              }, null, 2),
            },
          ],
        };

      case 'update':
        if (!session_id) {
          throw new Error('Session ID is required for update action');
        }
        
        const sessionToUpdate = conversations.get(session_id);
        if (!sessionToUpdate) {
          throw new Error(`Session not found: ${session_id}`);
        }
        
        if (title) {
          sessionToUpdate.title = title;
        }
        sessionToUpdate.updatedAt = new Date().toISOString();
        conversations.set(session_id, sessionToUpdate);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'update',
                session: sessionToUpdate,
                message: 'Session updated successfully',
              }, null, 2),
            },
          ],
        };

      case 'delete':
        if (!session_id) {
          throw new Error('Session ID is required for delete action');
        }
        
        const deleted = conversations.delete(session_id);
        if (!deleted) {
          throw new Error(`Session not found: ${session_id}`);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'delete',
                session_id,
                message: 'Session deleted successfully',
              }, null, 2),
            },
          ],
        };

      case 'search':
        if (!search_term) {
          throw new Error('Search term is required for search action');
        }
        
        const searchResults = Array.from(conversations.values())
          .filter(session => 
            session.title.toLowerCase().includes(search_term.toLowerCase()) ||
            session.messages.some(msg => 
              msg.content.toLowerCase().includes(search_term.toLowerCase())
            )
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'search',
                search_term,
                results_count: searchResults.length,
                results: searchResults.map(session => ({
                  id: session.id,
                  title: session.title,
                  message_count: session.messages.length,
                  createdAt: session.createdAt,
                  updatedAt: session.updatedAt,
                })),
              }, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Conversation management error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Conversation management failed',
            message: error.message,
            action,
            session_id,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}
