const { fetchBenefitsData } = require('../lib/sheets');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const benefits = await fetchBenefitsData();
    
    // Count organizations and their benefits
    const organizationCounts = {};
    
    benefits.forEach(benefit => {
      if (benefit.organization && benefit.organization.trim()) {
        const org = benefit.organization.trim();
        organizationCounts[org] = (organizationCounts[org] || 0) + 1;
      }
    });

    // Get top organizations
    const topOrganizations = Object.entries(organizationCounts)
      .map(([name, count]) => ({ name, count }))
      .filter(org => org.count >= 2) // Only show organizations with 2+ benefits
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 organizations

    res.json({
      success: true,
      organizations: topOrganizations,
      total: topOrganizations.length
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch organizations' 
    });
  }
};