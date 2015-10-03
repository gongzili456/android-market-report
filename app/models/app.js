export default function (sequelize, DataTypes) {

  var app = sequelize.define('App', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: DataTypes.STRING,
    apk_name: DataTypes.STRING,
    icon: DataTypes.STRING,
    auth: DataTypes.STRING,
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'app',
    underscored: true,


    classMethods: {
      associate: function (models) {
        app.hasMany(models.MarketApp);

        app.belongsToMany(models.User, {
          through: 'user_app'
        });
      }
    }
  });

  return app;
};
