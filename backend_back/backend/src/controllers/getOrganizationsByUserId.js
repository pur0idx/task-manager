import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const getOrganizationsByUserId = async (req, res) => {
    try {
        const organizations = await Organization.find(
            {
                "members.user": req.user.id,
            },
            "_id name"
        );
        res.json(organizations);
    } catch (error) {
        console.error("Error fetching organizations list:", error);
        res.status(500).json({ message: "Error fetching organizations" });
    }
};

export default getOrganizationsByUserId