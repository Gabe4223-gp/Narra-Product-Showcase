/**
 * teamRoutes.js - Using memberEmail to match the requestor
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Teams, TeamMembers } = require('../models'); // Adjust as needed

// Helper to find a requestor membership by email
async function findRequestorMembershipByEmail(teamId, requestorEmail) {
  if (!requestorEmail) return null;
  return TeamMembers.findOne({
    where: {
      teamId,
      memberEmail: requestorEmail
    }
  });
}

/**
 * 1) GET /api/teams
 *    Returns all teams the requesting user (matched by email) belongs to.
 */
router.get('/', async (req, res) => {
  try {
    // We'll read the user email from "user-email" header
    const requestingUserEmail = req.headers['user-email'];
    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email in headers.' });
    }

    // Find all TeamMembers rows with memberEmail = requestingUserEmail
    const memberships = await TeamMembers.findAll({
      where: { memberEmail: requestingUserEmail }
    });
    if (!memberships.length) {
      return res.json({ success: true, teams: [] });
    }

    // Gather all teamIds
    const teamIds = memberships.map(m => m.teamId);
    // Load Teams
    const teams = await Teams.findAll({ where: { id: teamIds } });
    return res.json({ success: true, teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * 2) GET /api/teams/:teamId/my-membership
 *    Returns the requestor's membership row (matched by email).
 */
router.get('/:teamId/my-membership', async (req, res) => {
  try {
    const { teamId } = req.params;
    const requestingUserEmail = req.headers['user-email'];
    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email in headers.' });
    }

    const membership = await findRequestorMembershipByEmail(teamId, requestingUserEmail);
    if (!membership) {
      return res.status(404).json({
        success: false,
        error: 'You are not a member of this team.'
      });
    }

    return res.json({ success: true, membership });
  } catch (error) {
    console.error('Error fetching membership:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * 3) GET /api/teams/:teamId/members
 *    Returns all TeamMembers rows for :teamId (the entire membership list).
 *    Only let them see if they are at least in the team themselves (or you can skip that check).
 */
router.get('/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    const requestingUserEmail = req.headers['user-email'];
    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email in headers.' });
    }

    // Ensure the requestor is part of the team
    const requestorMembership = await findRequestorMembershipByEmail(teamId, requestingUserEmail);
    if (!requestorMembership) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this team.'
      });
    }

    const members = await TeamMembers.findAll({ where: { teamId } });
    return res.json({ success: true, members });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * 4) POST /api/teams
 *    Create a new team. The requestor (matched by email) becomes isOwner=true, isAdmin=true.
 */
router.post('/', async (req, res) => {
  try {
    const requestingUserEmail = req.headers['user-email'];
    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email in headers.' });
    }

    const { teamName } = req.body;
    if (!teamName) {
      return res.status(400).json({ success: false, error: 'teamName is required.' });
    }

    // 1) Create the team
    const newTeam = await Teams.create({
      id: uuidv4(),
      teamName,
      createdBy: null // or you can store the email here if you like
    });

    // 2) Create the pivot row. We store the requestor as isOwner + isAdmin
    await TeamMembers.create({
      id: uuidv4(),
      teamId: newTeam.id,
      memberEmail: requestingUserEmail,
      memberName: '',  // or a default name if you want
      isOwner: true,
      isAdmin: true,
      applications: true,
      tenants: true,
      units: true,
      issues: true,
      billings: true,
      accounting: true,
      profitLoss: true,
      taxFiling: true,
      generalLedger: true
    });

    return res.status(201).json({
      success: true,
      team: newTeam,
      message: 'Team created successfully.'
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * 5) PUT /api/teams/:teamId
 *    Edit team name. Must be done by isOwner or isAdmin (your choice).
 */
router.put('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const requestingUserEmail = req.headers['user-email'];
    const { teamName } = req.body;

    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email.' });
    }
    if (!teamName) {
      return res.status(400).json({ success: false, error: 'teamName is required.' });
    }

    // Check membership
    const requestorMembership = await findRequestorMembershipByEmail(teamId, requestingUserEmail);
    if (!requestorMembership) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this team.'
      });
    }

    // If only owner can rename:
    // if(!requestorMembership.isOwner) ...
    // If admin can also rename:
    if (!(requestorMembership.isOwner || requestorMembership.isAdmin)) {
      return res.status(403).json({
        success: false,
        error: 'Only owner or admin can edit team name.'
      });
    }

    // Update the team
    const team = await Teams.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }
    team.teamName = teamName;
    await team.save();

    return res.json({
      success: true,
      updatedTeam: team
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * 6) DELETE /api/teams/:teamId
 *    Delete the team. Typically only the owner can do this.
 */
router.delete('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const requestingUserEmail = req.headers['user-email'];

    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email.' });
    }

    const requestorMembership = await findRequestorMembershipByEmail(teamId, requestingUserEmail);
    if (!requestorMembership) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this team.'
      });
    }

    if (!requestorMembership.isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can delete this team.'
      });
    }

    const team = await Teams.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }

    await team.destroy(); // cascades if onDelete: 'CASCADE'

    return res.json({ success: true, message: 'Team deleted successfully.' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * 7) POST /api/teams/:teamId/members
 *    Add a new member by name/email, or set their permissions. Admin/owner only.
 */
router.post('/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    const requestingUserEmail = req.headers['user-email'];
    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email.' });
    }

    // Check if requestor is admin or owner
    const requestorMembership = await findRequestorMembershipByEmail(teamId, requestingUserEmail);
    if (!requestorMembership || (!requestorMembership.isAdmin && !requestorMembership.isOwner)) {
      return res.status(403).json({
        success: false,
        error: 'Only admin/owner can add members.'
      });
    }

    const {
      memberName,
      memberEmail,
      isAdmin,
      applications,
      tenants,
      units,
      issues,
      billings,
      accounting,
      profitLoss,
      taxFiling,
      generalLedger
    } = req.body;

    const newMember = await TeamMembers.create({
      id: uuidv4(),
      teamId,
      memberName: memberName || '',
      memberEmail: memberEmail || '',
      isAdmin: !!isAdmin,
      applications: !!applications,
      tenants: !!tenants,
      units: !!units,
      issues: !!issues,
      billings: !!billings,
      accounting: !!accounting,
      profitLoss: !!profitLoss,
      taxFiling: !!taxFiling,
      generalLedger: !!generalLedger,
      isOwner: false // default
    });

    return res.status(201).json({
      success: true,
      member: newMember
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * 8) PUT /api/teams/:teamId/members/:memberId
 *    Update a member’s name, email, permissions, or isAdmin. 
 *    Owner can't be demoted if that’s your policy.
 */
router.put('/:teamId/members/:memberId', async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const requestingUserEmail = req.headers['user-email'];

    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email.' });
    }

    // Check if requestor is admin or owner
    const requestorMembership = await findRequestorMembershipByEmail(teamId, requestingUserEmail);
    if (!requestorMembership || (!requestorMembership.isAdmin && !requestorMembership.isOwner)) {
      return res.status(403).json({ success: false, error: 'Only an admin/owner can update members.' });
    }

    // Find the target membership
    const targetMembership = await TeamMembers.findByPk(memberId);
    if (!targetMembership || targetMembership.teamId !== teamId) {
      return res.status(404).json({ success: false, error: 'Member not found in this team.' });
    }

    // If the target is the owner, do not allow demotion
    if (targetMembership.isOwner && requestorMembership.memberEmail !== targetMembership.memberEmail) {
      if (req.body.isAdmin === false) {
        return res.status(403).json({ success: false, error: 'Cannot demote the owner.' });
      }
    }

    const {
      memberName,
      memberEmail,
      isAdmin,
      applications,
      tenants,
      units,
      issues,
      billings,
      accounting,
      profitLoss,
      taxFiling,
      generalLedger
    } = req.body;

    if (typeof memberName !== 'undefined') targetMembership.memberName = memberName;
    if (typeof memberEmail !== 'undefined') targetMembership.memberEmail = memberEmail;
    if (typeof isAdmin !== 'undefined') targetMembership.isAdmin = !!isAdmin;
    if (typeof applications !== 'undefined') targetMembership.applications = !!applications;
    if (typeof tenants !== 'undefined') targetMembership.tenants = !!tenants;
    if (typeof units !== 'undefined') targetMembership.units = !!units;
    if (typeof issues !== 'undefined') targetMembership.issues = !!issues;
    if (typeof billings !== 'undefined') targetMembership.billings = !!billings;
    if (typeof accounting !== 'undefined') targetMembership.accounting = !!accounting;
    if (typeof profitLoss !== 'undefined') targetMembership.profitLoss = !!profitLoss;
    if (typeof taxFiling !== 'undefined') targetMembership.taxFiling = !!taxFiling;
    if (typeof generalLedger !== 'undefined') targetMembership.generalLedger = !!generalLedger;

    await targetMembership.save();

    return res.json({ success: true, member: targetMembership });
  } catch (error) {
    console.error('Error updating member:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * 9) DELETE /api/teams/:teamId/members/:memberId
 *    Remove a member from the team. Admin/owner only. 
 *    If they're the owner, block removal unless it’s themselves.
 */
router.delete('/:teamId/members/:memberId', async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const requestingUserEmail = req.headers['user-email'];

    if (!requestingUserEmail) {
      return res.status(400).json({ success: false, error: 'Missing user-email.' });
    }

    const requestorMembership = await findRequestorMembershipByEmail(teamId, requestingUserEmail);
    if (!requestorMembership || (!requestorMembership.isAdmin && !requestorMembership.isOwner)) {
      return res.status(403).json({
        success: false,
        error: 'Only admin/owner can remove members.'
      });
    }

    const targetMembership = await TeamMembers.findByPk(memberId);
    if (!targetMembership || targetMembership.teamId !== teamId) {
      return res.status(404).json({
        success: false,
        error: 'Member not found in this team.'
      });
    }

    // If target is the owner, block removal if it's not themselves
    if (targetMembership.isOwner && requestorMembership.memberEmail !== targetMembership.memberEmail) {
      return res.status(403).json({
        success: false,
        error: 'Cannot remove the owner.'
      });
    }

    await targetMembership.destroy();
    return res.json({ success: true, message: 'Member removed from the team.' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
