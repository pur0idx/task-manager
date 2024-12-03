// const auth = require('../middleware/auth');
// const Organization = require("../models/Organization");
// const { router } = require("./organizationRoute");

// // Route for a member to leave an organizatio
// router.delete('/api/organizations/:id/members/leave', auth, async (req, res) => {
//     try {
//         const organization = await Organization.findById(req.params.id);

//         if (!organization) {
//             return res.status(404).json({ message: 'Organization not found' });
//         }

//         // Check if user is a member of the organization
//         const memberIndex = organization.members.findIndex(
//             member => member.user.toString() === req.user._id.toString()
//         );

//         if (memberIndex === -1) {
//             return res.status(403).json({ message: 'You are not a member of this organization' });
//         }

//         // Check if user is the last admin
//         const isAdmin = organization.members[memberIndex].role === 'admin';
//         const adminCount = organization.members.filter(m => m.role === 'admin').length;

//         if (isAdmin && adminCount === 1) {
//             return res.status(403).json({
//                 message: 'Cannot leave organization: You are the last admin. Please assign another admin first.'
//             });
//         }

//         // Remove the member
//         organization.members.splice(memberIndex, 1);
//         await organization.save();

//         res.json({
//             success: true,
//             message: 'Successfully left the organization'
//         });
//     } catch (error) {
//         console.error('Error leaving organization:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });
