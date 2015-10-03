export default function (sequelize, DataTypes) {

  var market = sequelize.define('Market', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: DataTypes.STRING
  }, {
    timestamps: false,
    tableName: 'market',
    underscored: true,
    classMethods: {
      associate: function (models) {
      }
    }
  });

  return market;
};
