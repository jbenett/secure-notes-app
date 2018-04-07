{
  "targets": [
    {
      "target_name": "verysecure",
      "sources": [ "module.cc" ]
    }
  ],
  "include_dirs": [
      "<!(node -e \"require('nan')\")"
  ]
}
