export default function (sequelize, DataTypes) {

  var download = sequelize.define('Download', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    market_app_id: DataTypes.INTEGER,
    download_total: DataTypes.INTEGER,
    added: DataTypes.INTEGER
  }, {
    timestamps: true,
    tableName: 'rpt_download',
    underscored: true
  });

  return download;
};
