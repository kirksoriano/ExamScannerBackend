router.get('/:id/full', async (req, res) => {
  const tosId = req.params.id;

  try {
    const [tosRows] = await db.query("SELECT * FROM tos WHERE id = ?", [tosId]);
    const [itemsRows] = await db.query("SELECT * FROM tos_items WHERE tos_id = ?", [tosId]);

    if (tosRows.length === 0) return res.status(404).json({ error: "TOS not found" });

    res.json({
      tos: tosRows[0],
      items: itemsRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch TOS and items" });
  }
});
