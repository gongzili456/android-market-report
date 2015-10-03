export default function (sequelize, DataTypes) {

  var comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    m_id: DataTypes.STRING,
    market_app_id: DataTypes.INTEGER,
    content: DataTypes.STRING,
    version: DataTypes.STRING,
    score: DataTypes.INTEGER,
    user_ip: DataTypes.STRING,
    machine: DataTypes.STRING,
    publish_time: DataTypes.DATE
  }, {
    timestamps: true,
    tableName: 'rpt_comment',
    underscored: true
  });

  return comment;
};
