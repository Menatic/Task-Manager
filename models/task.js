module.exports = (sequelize, DataTypes) => {
    const Task = sequelize.define('Task', {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      description: {
        type: DataTypes.TEXT
      },
      priority: {
        type: DataTypes.ENUM('High', 'Medium', 'Low'),
        defaultValue: 'Medium'
      },
      // In your Task model definition
    status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'),
    defaultValue: 'Pending'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
      due_date: {
        type: DataTypes.DATE
      },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      assignee_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      timestamps: true,
      underscored: true,
      paranoid: true,
      tableName: 'tasks'
    });
  
    Task.associate = (models) => {
      Task.belongsTo(models.User, {
        foreignKey: 'assignee_id',
        as: 'assignee'
      });
      Task.belongsTo(models.Team, {
        foreignKey: 'team_id',
        as: 'team'
      });
    };
  
    return Task;
  };