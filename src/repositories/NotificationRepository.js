const Notification = require('../models/Notification');

class NotificationRepository {
  async create(notificationData) {
    const notification = new Notification(notificationData);
    return notification.save();
  }

  async findById(id, userId) {
    return Notification.findOne({ 
      _id: id, 
      userId,
      deletedAt: null 
    });
  }

  async findPaginated(userId, { page = 1, limit = 20, isRead }) {
    const query = { userId, deletedAt: null };
    
    if (typeof isRead === 'boolean') {
      query.isRead = isRead;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async markAsRead(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { userId, isRead: false, deletedAt: null },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );
  }

  async softDelete(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
  }

  async countUnread(userId) {
    return Notification.countDocuments({
      userId,
      isRead: false,
      deletedAt: null
    });
  }
}

module.exports = new NotificationRepository();