module.exports = (sequelize, DataTypes) => {
    const Team = sequelize.define('Team', {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      timestamps: true,
      underscored: true
    });
  
    Team.associate = (models) => {
      Team.hasMany(models.Task, {
        foreignKey: 'team_id',
        as: 'tasks'
      });
      Team.belongsToMany(models.User, {
        through: 'TeamMember',
        foreignKey: 'team_id',
        as: 'members'
      });
    };
  
    return Team;
  };