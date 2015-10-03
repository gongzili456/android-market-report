export default function (sequelize, DataTypes) {

  var version = sequelize.define('Version', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    market_app_id: DataTypes.INTEGER,
    publish_time: DataTypes.DATE,
    version: DataTypes.STRING,
    version_code: DataTypes.STRING,
    package_id: DataTypes.STRING,
    group_id: DataTypes.STRING,
    doc_id: DataTypes.STRING
  }, {
    timestamps: true,
    tableName: 'rpt_version',
    underscored: true
  });

  return version;
};
