const Attribute = require('../models/Attribute');

const getAttributes = async (req, res) => {
    try {
        const attributes = await Attribute.find().sort({ name: 1 });
        return res.json(attributes);
    } catch (error) {
        console.error("Error fetching attributes:", error);
        return res.status(500).json({ error: "Error fetching attributes" });
    }
};

module.exports = {
    getAttributes
};
