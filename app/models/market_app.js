export default function (sequelize, DataTypes) {

  var marketApp = sequelize.define('MarketApp', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    app_id: DataTypes.INTEGER,
    market_id: DataTypes.INTEGER,
    apk_name: DataTypes.STRING,
    app_name: DataTypes.STRING,
    doc_id: DataTypes.STRING,
    group_id: DataTypes.STRING,
    package_id: DataTypes.STRING,
    m_app_id: DataTypes.STRING,
    tags: DataTypes.STRING,
    category_1: DataTypes.STRING,
    category_2: DataTypes.STRING,
    current_version: DataTypes.STRING,
    current_version_code: DataTypes.STRING,
    comment_count: DataTypes.INTEGER
  }, {
    timestamps: true,
    tableName: 'market_app',
    underscored: true,

    classMethods: {
      associate: function (models) {
        marketApp.belongsTo(models.App, {
          through: 'market_app'
        });

        marketApp.belongsTo(models.Market, {
          foreignKey: 'market_id'
        })
      }
    }
  });

  return marketApp;
};
