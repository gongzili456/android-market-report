export default function (sequelize, DataTypes) {

  var user = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    avatar: DataTypes.STRING,
    type: DataTypes.INTEGER,
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    timestamps: true,
    tableName: 'user',
    underscored: true,

    classMethods: {
      associate: function (models) {
        user.belongsToMany(models.App, {
          through: 'user_app'
        });
      }
    }
  });

  return user;
};
