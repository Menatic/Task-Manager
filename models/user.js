module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      timestamps: true,
      underscored: true,
      paranoid: true
    });
  
    User.associate = (models) => {
      User.hasMany(models.Task, {
        foreignKey: 'assignee_id',
        as: 'tasks'
      });
      User.belongsToMany(models.Team, {
        through: 'TeamMember',
        foreignKey: 'user_id',
        as: 'teams'
      });
    };
  
    return User;
  };