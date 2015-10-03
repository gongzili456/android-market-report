export default function(sequelize, DataTypes) {

  var score = sequelize.define('Score', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    market_app_id: DataTypes.INTEGER,
    score: DataTypes.INTEGER,
  }, {
    timestamps: true,
    tableName: 'rpt_score',
    underscored: true
  });

  return score;
};
