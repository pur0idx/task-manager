import express from 'express';
import authenticateJWT from '../middlewares/authenticateJWT'
import Organization from '../models/Organization'

const router = express.Router();

// Route for a member to leave an organization
router.patch('/api/organizations/:id/leave', authenticateJWT, async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Check if user is a member of the organization
        const memberIndex = organization.members.findIndex(
            member => member.user.toString() === req.user._id.toString()
        );

        if (memberIndex === -1) {
            return res.status(400).json({ message: 'You are not a member of this organization' });
        }

        // Remove the member from the organization
        organization.members.splice(memberIndex, 1);
        await organization.save();

        res.json({ 
            success: true, 
            message: 'Successfully left the organization'
        });
    } catch (error) {
        console.error('Error leaving organization:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router