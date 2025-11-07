const request = require('supertest');
const mongoose = require('mongoose');

// Importa o app SEM as conexões
const app = require('../../src/app');
const User = require('../../src/models/User');
const Notification = require('../../src/models/Notification');

describe('Notifications API Integration Tests', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
        // Garante que está conectado
        if (mongoose.connection.readyState === 0) {
            throw new Error('MongoDB não está conectado nos testes');
        }

        // Cria um usuário e faz login
        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        userId = user._id;

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        authToken = loginResponse.body.data.token;
    });

    describe('POST /api/notifications', () => {
        it('deve criar uma notificação com sucesso', async () => {
            const response = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Nova notificação',
                    message: 'Conteúdo da notificação',
                    type: 'info'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.title).toBe('Nova notificação');
        });

        it('deve retornar erro 401 sem autenticação', async () => {
            const response = await request(app)
                .post('/api/notifications')
                .send({
                    title: 'Teste',
                    message: 'Mensagem'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('deve validar campos obrigatórios', async () => {
            const response = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Sem mensagem'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('validação');
        });
    });

    describe('GET /api/notifications', () => {
        beforeEach(async () => {
            await Notification.create([
                { userId, title: 'N1', message: 'M1', isRead: false },
                { userId, title: 'N2', message: 'M2', isRead: true },
                { userId, title: 'N3', message: 'M3', isRead: false }
            ]);
        });

        it('deve listar notificações com paginação', async () => {
            const response = await request(app)
                .get('/api/notifications?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination.total).toBe(3);
        });

        it('deve filtrar por isRead', async () => {
            const response = await request(app)
                .get('/api/notifications?isRead=false')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.every(n => !n.isRead)).toBe(true);
        });
    });

    describe('PATCH /api/notifications/:id/read', () => {
        it('deve marcar notificação como lida', async () => {
            const notification = await Notification.create({
                userId,
                title: 'Teste',
                message: 'Mensagem',
                isRead: false
            });

            const response = await request(app)
                .patch(`/api/notifications/${notification._id}/read`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isRead).toBe(true);
        });

        it('deve retornar 404 para notificação inexistente', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            await request(app)
                .patch(`/api/notifications/${fakeId}/read`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('DELETE /api/notifications/:id', () => {
        it('deve deletar notificação (soft delete)', async () => {
            const notification = await Notification.create({
                userId,
                title: 'Para deletar',
                message: 'Mensagem'
            });

            const response = await request(app)
                .delete(`/api/notifications/${notification._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verifica se foi soft delete
            const deleted = await Notification.findById(notification._id);
            expect(deleted.deletedAt).toBeDefined();
        });
    });

    describe('GET /api/notifications/unread-count', () => {
        it('deve retornar contagem de não lidas', async () => {
            await Notification.create([
                { userId, title: 'N1', message: 'M1', isRead: false },
                { userId, title: 'N2', message: 'M2', isRead: true },
                { userId, title: 'N3', message: 'M3', isRead: false }
            ]);

            const response = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(2);
        });
    });
});